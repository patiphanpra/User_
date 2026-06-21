# Nginx Configuration Guide

This directory contains Nginx configurations for the Member Management System.

## Files

### `nginx.dev.conf`
Development configuration:
- Listens on port 80
- Proxies `/api/*` to Go backend (port 8080)
- Proxies all other routes to Next.js frontend (port 3000)
- Includes WebSocket support for development tools
- Security headers configured
- No SSL/HTTPS (for local development)

### `nginx.prod.conf`
Production configuration:
- Listens on ports 80 and 443 (HTTPS)
- Implements rate limiting zones
- Proxies `/api/*` to Go backend with queueing
- Proxies frontend routes with caching
- Compresses responses with gzip
- Advanced security headers
- SSL/HTTPS support (requires certificates in `ssl/` directory)
- Static asset caching with long expiration
- Performance optimization (buffer sizes, timeouts)

## SSL Certificates

For production deployment, place SSL certificates in the `ssl/` directory:

```bash
ssl/
├── cert.pem        # Your SSL certificate
└── key.pem         # Your private key
```

### Getting SSL Certificates

#### Free Option: Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy to nginx ssl directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

#### Using Paid SSL Provider

1. Purchase certificate from provider (Comodo, Sectigo, etc.)
2. Download certificate and key files
3. Place in `nginx/ssl/` directory as `cert.pem` and `key.pem`

## Configuration Details

### Rate Limiting (Production)

```
api_limit: 10 requests/second per IP
general_limit: 30 requests/second per IP
```

Adjust in `nginx.prod.conf` if needed:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;
```

### Gzip Compression

Enabled for:
- Text files
- CSS and JavaScript
- JSON and XML
- Fonts
- SVG images

Compression level: 6 (balanced between performance and compression ratio)

### Health Checks

Endpoint: `/health`

Used by Docker Compose to verify service health:
```bash
curl http://localhost/health  # Returns "healthy\n"
```

### Cache Configuration (Production)

Static assets (JS, CSS, images) are cached for 30 days:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    proxy_cache_valid 200 30d;
}
```

### Security Headers

Production configuration includes:
```
X-Frame-Options: SAMEORIGIN              # Prevent clickjacking
X-Content-Type-Options: nosniff           # Prevent MIME sniffing
X-XSS-Protection: 1; mode=block          # XSS protection
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation, microphone, camera blocked
```

## Development Usage

In docker-compose.yml (development), you can optionally add Nginx:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
  volumes:
    - ./nginx/nginx.dev.conf:/etc/nginx/nginx.conf:ro
  depends_on:
    - backend
    - frontend
  networks:
    - member-network
```

Access via: http://localhost

## Production Usage

In docker-compose.prod.yml, Nginx is included:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
```

Access via: https://yourdomain.com

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 80
lsof -i :80

# Or on Windows
netstat -ano | findstr :80
```

### SSL Certificate Errors

```bash
# Verify certificate
openssl x509 -in nginx/ssl/cert.pem -noout -text

# Check certificate expiration
openssl x509 -in nginx/ssl/cert.pem -noout -dates
```

### Proxy Connection Errors

Check service URLs:
- Backend: http://backend:8080 (inside Docker network)
- Frontend: http://frontend:3000 (inside Docker network)

These should only be accessed via these internal addresses from within containers.

### Nginx Errors

```bash
# Check nginx logs
docker logs mmgmt-nginx-prod

# Test configuration
docker exec mmgmt-nginx-prod nginx -t
```

## Performance Tuning

### Request Timeouts

Adjust in nginx configuration:
```nginx
proxy_connect_timeout 60s;   # Connection timeout
proxy_send_timeout 60s;      # Send timeout  
proxy_read_timeout 60s;      # Read timeout
```

### Buffer Sizes

```nginx
proxy_buffer_size 4k;
proxy_buffers 8 4k;
```

Increase if handling large responses.

### Worker Connections

```nginx
worker_connections 1024;
```

Increase for high-concurrency scenarios.

## References

- [Nginx Official Documentation](https://nginx.org/en/docs/)
- [Nginx Best Practices](https://www.nginx.com/resources/wiki/)
- [Let's Encrypt](https://letsencrypt.org/)
