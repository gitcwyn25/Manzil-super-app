#!/bin/sh
set -eu

# These are real volume paths; ownership must follow them, not the symlinks.
mkdir -p /persist/data/logs /persist/uploads/files /persist/uploads/covers \
  /persist/uploads/avatars /persist/uploads/photos /persist/uploads/journey \
  /persist/uploads/places
chown -R node:node /persist/data /persist/uploads

# Keep upstream initialization, validation, privilege drop and signal handling.
exec /usr/local/bin/trek-entrypoint
