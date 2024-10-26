FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY .htpasswd /etc/nginx/.htpasswd
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 5000

CMD ["nginx", "-g", "daemon off;"]