# 🌸 Blossom-server

Blobs stored simply on mediaservers

# Get started

## Prerequisites

- [NodeJS](https://nodejs.org/en) - Will run the project
- [Docker](https://www.docker.com/) - Containerize the app (virtualization)
- [NGINX](https://www.nginx.com/) - Domain will point to a machine IP and NGINX routes request to a server port
- [Certbot](https://certbot.eff.org) - Enables SSL by creating certificates and updating NGINX config

### Install NodeJS

We will install it by using NVM (Node Version Manager):
```sh
sudo apt update
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
```

Reload bash:

```sh
source ~/.bashrc 
```

Install Node LTS version
```sh
nvm install --lts
```

### Install Docker

Cleanup packages:

```sh
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done
```

Add Docker's official GPG key:

```sh
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Add the repository to Apt sources:

```sh
echo   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
     $(. /etc/os-release && echo "$VERSION_CODENAME") stable" |   sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

Install Docker:

```sh
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Install NGINX

```sh
sudo apt install nginx
```

### Install Certbot
```sh
sudo apt install certbot python3-certbot-nginx -y
```

## Prepare

### Important

If you are using a fresh machine, I suggest you create a non-root user to run the server (docker). We will create a user called `blossom`:

```sh
adduser blossom
```

Add a new user to the `docker` group, so it can be executed without `sudo`:
```sh
adduser blossom docker
```

Add a new user to the `sudo` group, so you can edit system settings when needed:
```sh
adduser blossom sudo
```

Switch to new user:
```sh
sudo su - blossom
```

### Prepare Repo

Clone the repo:

```sh
git clone https://github.com/hzrd149/blossom-server.git
```

Go to the folder:
```sh
cd blossom-server
```

Create `data` folder (for sqlite):
```sh
mkdir data
```

Create `config` file based on config example:
```sh
cp config.example.yml config.yml
```

Edit the following line in the `config.yml`:
```sh
publicDomain: http://cdn.example.com # <-- set your domain
```

Install dependencies:
```sh
npm install
```

## Run on a production machine

### Docker

Build the Docker container:
```sh
npm run docker
```

Confirm it's running:

```sh
docker ps
```

The result should show something like this:

```sh
CONTAINER ID   IMAGE                COMMAND                 CREATED       STATUS       PORTS                      NAMES
4dab0563cab5   blossom-server-api   "node build/index.js"   1 minute ago   Up 1 minute ago   127.0.0.1:3010->3000/tcp   blossom-api
```

### NGINX

On our machine, `blossom-server` is now running on port `3010`

We need to configure NGINX to point a domain to that port.

In the following code, replace every instance of `$BLOSSOM_DOMAIN` with a domain you want:

```sh
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
```

To enable SSL, certbot needs to be run:

```sh
sudo certbot --nginx --agree-tos -n -d $BLOSSOM_DOMAIN -m certbot@$BLOSSOM_DOMAIN
```

Restart the Nginx service:

```sh
sudo service nginx restart
```

### Done

Go ahead and visit the domain you've chosen. App should be up and running.

## Development server

Run dev server:
```sh
npm run dev
```

## Production build (non Docker)

Build the app:
```sh
npm run build
```

Run the app:
```sh
npm start
```
