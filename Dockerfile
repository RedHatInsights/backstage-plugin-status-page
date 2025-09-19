## Stage 1: Installing dependencies
FROM registry.access.redhat.com/ubi9/nodejs-20:latest as build

USER 0

# Install yarn
RUN \
    dnf install -y python3 make g++ zlib-devel openssl-devel brotli-devel && \
    npm i -g corepack && corepack enable && \
    corepack prepare yarn@4.6.0 --activate

COPY . .

RUN yarn install

# Fix for the "dubious ownership" warning
RUN git config --global --add safe.directory /opt/app-root/src

# Compiling and building the backstage application
RUN NODE_OPTIONS="--max-old-space-size=4096" yarn tsc && yarn build:all


## Stage 3: Final stage
FROM registry.access.redhat.com/ubi9/nodejs-20-minimal:latest as runner

USER 0

RUN \
    microdnf install -y gzip python3 python3-pip make g++ zlib-devel openssl-devel brotli-devel && \
    microdnf clean all && \
    pip3 install mkdocs-techdocs-core==1.1.7 && \
    npm i -g corepack && corepack enable && \
    corepack prepare yarn@4.6.0 --activate

# Copy the install dependencies and built packages from the build stage
COPY --from=build --chown=1001:0 $HOME/yarn.lock $HOME/.yarnrc.yml $HOME/package.json $HOME/packages/backend/dist/skeleton.tar.gz $HOME/packages/backend/dist/bundle.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz && \
    tar xzf bundle.tar.gz && rm bundle.tar.gz

# Install production dependencies
RUN yarn workspaces focus --all --production

# Copy backstage app-config files
COPY --chown=1001:0 examples $HOME/examples/
COPY --chown=1001:0 ./soundcheck $HOME/soundcheck/
COPY --chown=1001:0 ./app-config*.yaml ./backstage.json ./

# The fix-permissions script is important when operating in environments that dynamically use a random UID at runtime, such as OpenShift.
# The upstream backstage image does not account for this and it causes the container to fail at runtime.
RUN fix-permissions ./

USER 1001

EXPOSE 7007

CMD ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.production.yaml", "--no-node-snapshot"]
