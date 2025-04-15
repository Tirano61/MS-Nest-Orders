


# Orders Microservice

- Inicializar la base de datos postgres desde `docker-compose.yml`.
```
docker compose up -d
```
- Levantar la base de datos prisma
```
npx prisma migrate dev --name <Nombre de la migración>
```
