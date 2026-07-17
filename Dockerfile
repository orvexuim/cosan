FROM nginx:alpine

# Metadata labels
LABEL maintainer="COSMAN DevOps Team <admin@cosman.com>" \
      version="1.0.0" \
      description="Production image for COSMAN luxury e-commerce platform serving pure static assets with highly secure Nginx setup."

# Clean default assets and set up destination
RUN rm -rf /usr/share/nginx/html/*

# Copy static frontend files
COPY index.html shop.html product.html cart.html auth.html admin.html brand-guide.html /usr/share/nginx/html/
COPY manifest.json sw.js robots.txt sitemap.xml /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard and SSL ports
EXPOSE 80 443

# Healthcheck to verify local container reachability
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
