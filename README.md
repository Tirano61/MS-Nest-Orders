


# Orders Microservice

1. Inicializar la base de datos postgres desde `docker-compose.yml`.

    ```Docker
    docker compose up -d
    ```

2. Levantar la base de datos prisma

    ```npm
    npx prisma migrate dev --name <Nombre de la migración>
    ```

3. Levantar el servidor de NTAS

    ```Docker
    docker run -d --name nats-main -p 4222:4222 -p 6222:6222 -p 8222:8222 nats
    ```

4. Ejecutar `npm run start:dev`  
