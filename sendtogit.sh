#/bin/bash

sudo rsync -r --update --progress ./* ~/Documents/webGL-LEAP/
cd ~/Documents/webGL-LEAP/
git add *
git commit 
git push

