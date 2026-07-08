package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/makeitshort/backend/internal/shortid"
)

const maxURLLength = 2048

func (s *Server) handleShorten() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ShortenRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			s.writeError(w, http.StatusBadRequest, "invalid request payload")
			return
		}

		req.URL = strings.TrimSpace(req.URL)
		if req.URL == "" {
			s.writeError(w, http.StatusBadRequest, "url is required")
			return
		}

		if len(req.URL) > maxURLLength {
			s.writeError(w, http.StatusBadRequest, "url exceeds maximum length of 2048 characters")
			return
		}

		parsedURL, err := url.ParseRequestURI(req.URL)
		if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
			s.writeError(w, http.StatusBadRequest, "invalid url format, must start with http:// or https://")
			return
		}

		id := shortid.GenerateBase62()

		ctx := r.Context()
		
		// Write to Supabase
		var results []interface{}
		err = s.supabase.DB.From("links").Insert(map[string]interface{}{
			"id":           id,
			"original_url": req.URL,
		}).Execute(&results)
		if err != nil {
			s.logger.Error("failed to insert link into database", "error", err)
			s.writeError(w, http.StatusInternalServerError, "internal server error")
			return
		}

		// Cache in Redis (48h TTL)
		// We use 48 hours as requested in todo.md
		err = s.redis.Set(ctx, "link:"+id, req.URL, 48*time.Hour).Err()
		if err != nil {
			s.logger.Error("failed to cache link in redis", "error", err)
			// Continue returning success even if cache write fails
		}

		// Ensure BaseURL doesn't end with a slash for clean formatting
		baseURL := strings.TrimRight(s.baseURL, "/")
		
		resp := ShortenResponse{
			ID:       id,
			ShortURL: baseURL + "/" + id,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(resp)
	}
}

func (s *Server) writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}

func (s *Server) handleRedirect() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		if id == "" {
			http.NotFound(w, r)
			return
		}

		ctx := r.Context()

		// 1. Try fetching from Redis first
		originalURL, err := s.redis.Get(ctx, "link:"+id).Result()
		if err == nil && originalURL != "" {
			http.Redirect(w, r, originalURL, http.StatusMovedPermanently)
			return
		}

		// 2. Fallback to Supabase if not in Redis
		var results []struct {
			OriginalURL string `json:"original_url"`
		}
		
		err = s.supabase.DB.From("links").Select("original_url").Eq("id", id).Execute(&results)
		if err != nil {
			s.logger.Error("failed to query supabase for link", "error", err, "id", id)
			http.NotFound(w, r) // You could potentially return 500 here, but let's assume it might not exist
			return
		}

		if len(results) == 0 || results[0].OriginalURL == "" {
			http.NotFound(w, r)
			return
		}

		originalURL = results[0].OriginalURL

		// 3. Cache it back to Redis asynchronously to avoid blocking the redirect
		go func(cacheID, url string) {
			// Using a background context since request context will be cancelled
			// Use the same 48h TTL as handleShorten
			err := s.redis.Set(context.Background(), "link:"+cacheID, url, 48*time.Hour).Err()
			if err != nil {
				s.logger.Error("failed to cache link in redis after db lookup", "error", err)
			}
		}(id, originalURL)

		// 4. Redirect
		http.Redirect(w, r, originalURL, http.StatusMovedPermanently)
	}
}
