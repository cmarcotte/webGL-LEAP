#/bin/bash

if [ -n "$1" ]
then
	sudo rsync -r --update --progress $1/* ~/Documents/webGL-LEAP/
fi
cd ~/Documents/webGL-LEAP/
git add *
git commit 
git push
