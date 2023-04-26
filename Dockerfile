## Build stage
FROM registry.access.redhat.com/ubi9/nodejs-18 as unpacking

USER root

RUN dnf install -y python3 && \
    npm install --global yarn && \
    yarn config set python /usr/bin/python3

COPY yarn.lock package.json packages/backend/dist/skeleton.tar.gz $HOME/
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

RUN yarn install --frozen-lockfile --production --network-timeout 300000

COPY packages/backend/dist/bundle.tar.gz $HOME/ 
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# Final stage
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal as runner

COPY --from=unpacking --chown=1001:0 /opt/app-root/src $HOME/
COPY --chown=1001:0 app-config*.yaml $HOME/
COPY --chown=1001:0 examples $HOME/examples/

RUN fix-permissions ./

EXPOSE 7007

CMD ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]
