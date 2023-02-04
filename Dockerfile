from denoland/deno:alpine-1.30.2

run apk add --no-cache sqlite-libs
env DENO_SQLITE_PATH=/usr/lib/libsqlite3.so.0

arg GIT_REVISION
env DENO_DEPLOYMENT_ID=${GIT_REVISION}

workdir /app
copy . .
run deno cache main.ts

volume /app/storage

expose 8000

cmd ["run", "--unstable", "-A", "main.ts"]