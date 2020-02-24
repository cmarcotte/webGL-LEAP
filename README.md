# webGL-LEAP
Repository for the development of webGL codes for testing defibrillation techniques including LEAP.

## Installation
First install [nginx](https://nginx.org/). 
Configure with
`
server {
        listen      80 default_server;
        listen      [::]:80 default_server;
        servername  localhost;
        root        <nginx html directory>
        autoindex   on;
`

and then copy the contents of the repository to the <nginx html directory>.

To run, open a webGL-capable web browser and point it to `localhost`.
