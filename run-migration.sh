#!/bin/bash
export PATH="/home/marcelkuzma/.nvm/versions/node/v22.18.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
cd /home/marcelkuzma/web/nuxt-app
npx drizzle-kit migrate 2>&1
