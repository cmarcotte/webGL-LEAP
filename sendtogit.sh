#/bin/bash

cd ~/Documents/webGL-LEAP/

# update git repo
git add *
git commit 
git push

# make webGL run directory match updated git repo
sudo rsync -r --update --progress ./* /var/www/html/
