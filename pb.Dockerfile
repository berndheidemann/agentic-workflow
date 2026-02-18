FROM ghcr.io/muchobien/pocketbase:latest

# Copy JS migrations so PocketBase runs them automatically on startup
COPY pb_migrations/ /pb/pb_migrations/

# Copy server-side hooks (empty directory for now, populated in future REQs)
COPY pb_hooks/ /pb/pb_hooks/
