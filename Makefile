#Made for deploying application
appName=mppcControl

all: | deploy enable

enable: server.js
	sed -i -e '$$i /var/www/$(appName)/node_modules/forever/bin/forever start /var/www/$(appName)/server.js \n' 
/etc/rc.local
	service nginx restart
	/var/www/$(appName)/node_modules/forever/bin/forever start /var/www/$(appName)/server.js

deploy:$(appName)
	cp ./geigerControl /etc/nginx/sites-available/$<
	ln -sf /etc/nginx/sites-available/$< /etc/nginx/sites-enabled/$<
	rm -f /etc/nginx/sites-enabled/default
	mkdir -p /var/www/$</
	cd /var/www/$< &&\
	find . -maxdepth 1 ! -name 'node_modules' ! -name '.' ! -name '..' -exec rm -rf {} +
	cp -R ./* /var/www/$<
	cd /var/www/$< &&\
	npm install
	chmod -R 755 /var/www/$</*

$(appName):nginxTemplate
	sed -e 's/nginxTemplate/$@/g' $< > $@

database:

setup:
	apt-get -y update
	apt-get -y upgrade
	apt-get -y install nginx
	curl -sLS https://nodejs.org/dist/v4.4.7/node-v4.4.7-linux-armv7l.tar.xz
	tar -xvf node-v4.4.7-linux-armv7l.tar.xz
	cd node-v4.4.7-linux-armv7l 
	apt-get -y install npm


cleanAll: clean
	rm -rf /var/www/$(appName)

clean:
	rm $(appName)
