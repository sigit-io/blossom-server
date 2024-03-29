# 🌸 Blossom-server

Blobs stored simply on mediaservers

# Get started

## Prerequisites

- [NodeJS](https://nodejs.org/en)
- [Docker](https://www.docker.com/)
- [NGINX](https://www.nginx.com/)
- [Certbot](https://certbot.eff.org) `sudo apt install certbot python3-certbot-nginx -y`

## Prepare

Create `data` folder (for sqlite):
```sh
mkdir data
```

Create `config` file:
```sh
cp config.example.yml config.yml
```

Install dependencies:
```sh
npm install
```

## Development

Run dev server:
```sh
npm run dev
```

## Production

Build the app:
```sh
npm run build
```

Run the app:
```sh
npm start
```

## Docker

Build the Docker container:
```sh
npm run docker
```

## NGINX

```sh
BLOSSOM_DOMAIN=<some.domain>

sudo bash -c "cat >> /etc/nginx/sites-available/default" <<'EOF'

# Forward to Blossom Server
server {
  # Blossom domain
  server_name $BLOSSOM_DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:3010;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;

    client_max_body_size 100M;
  }
}
EOF

# To enable SSL, certbot needs to be run
sudo certbot --nginx --agree-tos -n -d $BLOSSOM_DOMAIN -m certbot@$BLOSSOM_DOMAIN

# Restart the Nginx service
sudo service nginx restart

```