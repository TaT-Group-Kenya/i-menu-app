FROM php:8.2-cli

# install dependencies
RUN apt-get update && apt-get install -y \
    git unzip curl libpng-dev libzip-dev zip

# install composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install

RUN php artisan key:generate

EXPOSE 10000

CMD php artisan serve --host=0.0.0.0 --port=10000