package server

type ShortenRequest struct {
	URL string `json:"url"`
}

type ShortenResponse struct {
	ID       string `json:"id"`
	ShortURL string `json:"short_url"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
