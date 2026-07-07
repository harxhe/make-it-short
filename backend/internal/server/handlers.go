package server

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

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
		
		// Write to Postgres
		_, err = s.postgres.Exec(ctx,
			"INSERT INTO links (id, original_url) VALUES ($1, $2)",
			id, req.URL,
		)
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
