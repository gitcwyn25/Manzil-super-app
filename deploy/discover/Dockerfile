# Official TREK v5.1.0; application code and features stay upstream.
FROM mauriceboe/trek:5.1.0@sha256:23bf3fa6a134dc38a3b4f40ef8f7e8040abc96965105dffdcfcf5f202fb5d0b7

# Railway mounts one durable volume. Preserve the upstream two-directory
# layout through symlinks into separate directories on that volume.
RUN mv /app/data /app/image-data \
    && mv /app/uploads /app/image-uploads \
    && ln -s /persist/data /app/data \
    && ln -s /persist/uploads /app/uploads

COPY --chmod=0755 start.sh /usr/local/bin/manzil-discover-start
CMD ["/usr/local/bin/manzil-discover-start"]
