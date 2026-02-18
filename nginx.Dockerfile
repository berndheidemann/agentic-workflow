FROM nginx:1.27-alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static sites
COPY sites/hub /srv/sites/hub
COPY sites/ap1 /srv/sites/ap1

EXPOSE 80
