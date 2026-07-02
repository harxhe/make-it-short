package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/makeitshort/backend/internal/config"
)

type Server struct {
	httpServer *http.Server
	logger     *slog.Logger
	postgres   *pgxpool.Pool
	redis      *redis.Client
}

func New(cfg config.Config, logger *slog.Logger, postgres *pgxpool.Pool, redis *redis.Client) *Server {
	r := chi.NewRouter()

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
		ReadTimeout:       cfg.ReadTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
	}

	return &Server{
		httpServer: srv,
		logger:     logger,
		postgres:   postgres,
		redis:      redis,
	}
}

func (s *Server) Start() error {
	s.logger.Info("http server starting", "addr", s.httpServer.Addr)

	if err := s.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("http server shutting down")

	shutdownErr := s.httpServer.Shutdown(ctx)
	if s.redis != nil {
		if err := s.redis.Close(); err != nil {
			s.logger.Error("failed to close redis client", "error", err)
		}
	}
	if s.postgres != nil {
		s.postgres.Close()
	}

	return shutdownErr
}
