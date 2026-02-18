FROM ghcr.io/muchobien/pocketbase:latest

# Copy JS migrations to the correct location.
# PocketBase default: --dir=/pb_data, migrations in $dir/../pb_migrations
# But automigrate looks for migrations relative to the binary or in pb_migrations/
# The entrypoint uses --hooksDir=/pb_hooks, so hooks go there.
# For migrations: PocketBase checks pb_migrations/ relative to working directory.
COPY pb_migrations/ /pb_migrations/

# Copy server-side hooks (empty directory for now, populated in future REQs)
COPY pb_hooks/ /pb_hooks/
