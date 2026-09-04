ARG IMAGE_CV_BASE="cv-base:latest"

FROM $IMAGE_CV_BASE AS intermediate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /srv/
RUN pnpm i --frozen-lockfile

COPY . /srv
RUN pnpm run build

FROM $IMAGE_CV_BASE AS production

ENV NODE_ENV="production"

# Next.js standalone output: server.js plus a pruned node_modules. static/ and
# public/ are not included by the tracer and must be copied alongside it.
COPY --from=intermediate /srv/.next/standalone/ /srv/
COPY --from=intermediate /srv/.next/static/ /srv/.next/static/
COPY --from=intermediate /srv/public/ /srv/public/

# Migration SQL is read from disk at runtime, so the tracer never sees it.
COPY --from=intermediate /srv/drizzle/ /srv/drizzle/

RUN sed -i 's|command=|command=node /srv/server.js|' /etc/supervisor/conf.d/cv.conf

FROM $IMAGE_CV_BASE AS development

ENV NODE_ENV="development"

RUN printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -Eeuo pipefail' \
    'pnpm i --no-frozen-lockfile' \
    'exec "$@"' \
    '' > /entrypoint.sh \
  && chmod +x /entrypoint.sh \
  && sed -i 's|command=|command=pnpm run dev|' /etc/supervisor/conf.d/cv.conf

ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-nc", "/etc/supervisor/supervisord.conf"]
