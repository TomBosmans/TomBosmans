---
sidebar: false
---

# Postgresql version management with docker

install docker:
```shell
brew install --cask docker
````

create our container for the version, we are using 13 in this example:
```shell
docker run --name postgres-13 -e POSTGRES_HOST_AUTH_METHOD=trust -d -p 5432:5432 -v postgres-13:/var/lib/postgresql/data postgres:13-alpine
```

now lets install the postgres client:
```shell
brew install libpq
```

and set the following aliases in your `.zshrc`
```shell
export PATH="/usr/local/opt/libpq/bin:$PATH"
alias psql="psql -U postgres -h localhost -p 5432"
alias createdb="createdb -U postgres -h localhost -p 5432"
alias dropdb="dropdb -U postgres -h localhost -p 5432"
alias pg_dump="pg_dump -U postgres -h localhost -p 5432"
```
