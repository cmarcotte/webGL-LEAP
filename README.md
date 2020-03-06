# webGL-LEAP
Repository for the development of webGL codes for testing defibrillation techniques including LEAP.

## Installation
First install [nginx](https://nginx.org/). 
Configure with
```
server {
        listen      80 default_server;
        listen      [::]:80 default_server;
        servername  localhost;
        root        <nginx html directory>
        autoindex   on;
```

and then copy the contents of the repository to the <nginx html directory>.

Next, start nginx as root: `sudo service nginx start`.

If starting nginx fails because the port is in use: `sudo fuser -k 80/tcp`.

To run, open a webGL-capable web browser and point it to `localhost`.
