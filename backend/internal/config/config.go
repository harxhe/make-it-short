package config

import (
	"fmt"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppEnv             string
	Port               string
	BaseURL            string
	DatabaseURL        string
	RedisURL           string
	RedisMachineIDKey  string
	CacheTTL           time.Duration
	ShutdownTimeout    time.Duration
	ReadHeaderTimeout  time.Duration
	ReadTimeout        time.Duration
	WriteTimeout       time.Duration
	IdleTimeout        time.Duration
}

func Load() (Config, error) {
	databaseURL, err := resolveDatabaseURL()
	if err != nil {
		return Config{}, err
	}

	cfg := Config{
		AppEnv:            getEnv("APP_ENV", "development"),
		Port:              getEnv("PORT", "8080"),
		BaseURL:           getEnv("BASE_URL", "http://localhost:8080"),
		DatabaseURL:       databaseURL,
		RedisURL:          strings.TrimSpace(os.Getenv("REDIS_URL")),
		RedisMachineIDKey: getEnv("REDIS_MACHINE_ID_KEY", "makeitshort:node:registration:counter"),
	}

	cacheTTLSeconds, err := getEnvInt("CACHE_TTL_SECONDS", 172800)
	if err != nil {
		return Config{}, err
	}
	cfg.CacheTTL = time.Duration(cacheTTLSeconds) * time.Second

	shutdownTimeoutSeconds, err := getEnvInt("SHUTDOWN_TIMEOUT_SECONDS", 10)
	if err != nil {
		return Config{}, err
	}
	cfg.ShutdownTimeout = time.Duration(shutdownTimeoutSeconds) * time.Second

	readHeaderTimeoutSeconds, err := getEnvInt("HTTP_READ_HEADER_TIMEOUT_SECONDS", 5)
	if err != nil {
		return Config{}, err
	}
	cfg.ReadHeaderTimeout = time.Duration(readHeaderTimeoutSeconds) * time.Second

	readTimeoutSeconds, err := getEnvInt("HTTP_READ_TIMEOUT_SECONDS", 10)
	if err != nil {
		return Config{}, err
	}
	cfg.ReadTimeout = time.Duration(readTimeoutSeconds) * time.Second

	writeTimeoutSeconds, err := getEnvInt("HTTP_WRITE_TIMEOUT_SECONDS", 10)
	if err != nil {
		return Config{}, err
	}
	cfg.WriteTimeout = time.Duration(writeTimeoutSeconds) * time.Second

	idleTimeoutSeconds, err := getEnvInt("HTTP_IDLE_TIMEOUT_SECONDS", 60)
	if err != nil {
		return Config{}, err
	}
	cfg.IdleTimeout = time.Duration(idleTimeoutSeconds) * time.Second

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL (or SUPABASE_DATABASE_URL / SUPABASE_DB_*) is required")
	}

	if cfg.RedisURL == "" {
		return Config{}, fmt.Errorf("REDIS_URL is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func getEnvInt(key string, fallback int) (int, error) {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback, nil
	}

	value, err := strconv.Atoi(raw)
	if err != nil {
		return 0, fmt.Errorf("%s must be an integer: %w", key, err)
	}

	if value <= 0 {
		return 0, fmt.Errorf("%s must be > 0", key)
	}

	return value, nil
}

func resolveDatabaseURL() (string, error) {
	if value := strings.TrimSpace(os.Getenv("DATABASE_URL")); value != "" {
		return value, nil
	}

	if value := strings.TrimSpace(os.Getenv("SUPABASE_DATABASE_URL")); value != "" {
		return value, nil
	}

	return buildSupabaseDatabaseURLFromParts()
}

func buildSupabaseDatabaseURLFromParts() (string, error) {
	host := strings.TrimSpace(os.Getenv("SUPABASE_DB_HOST"))
	port := strings.TrimSpace(os.Getenv("SUPABASE_DB_PORT"))
	name := strings.TrimSpace(os.Getenv("SUPABASE_DB_NAME"))
	user := strings.TrimSpace(os.Getenv("SUPABASE_DB_USER"))
	password := strings.TrimSpace(os.Getenv("SUPABASE_DB_PASSWORD"))
	sslMode := getEnv("SUPABASE_DB_SSLMODE", "require")

	if host == "" && port == "" && name == "" && user == "" && password == "" {
		return "", nil
	}

	missing := make([]string, 0, 5)
	if host == "" {
		missing = append(missing, "SUPABASE_DB_HOST")
	}
	if port == "" {
		missing = append(missing, "SUPABASE_DB_PORT")
	}
	if name == "" {
		missing = append(missing, "SUPABASE_DB_NAME")
	}
	if user == "" {
		missing = append(missing, "SUPABASE_DB_USER")
	}
	if password == "" {
		missing = append(missing, "SUPABASE_DB_PASSWORD")
	}

	if len(missing) > 0 {
		return "", fmt.Errorf("incomplete Supabase DB config, missing: %s", strings.Join(missing, ", "))
	}

	databaseURL := &url.URL{
		Scheme:   "postgresql",
		Host:     net.JoinHostPort(host, port),
		Path:     "/" + name,
		RawQuery: "sslmode=" + url.QueryEscape(sslMode),
	}
	databaseURL.User = url.UserPassword(user, password)

	return databaseURL.String(), nil
}
