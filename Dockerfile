FROM ubuntu
MAINTAINER Alexander Stuckenholz

RUN apt-get update
RUN apt-get install -y git build-essential nodejs npm

ADD . /var/www
WORKDIR /var/www 
RUN git clone https://github.com/LosWochos76/webide
RUN npm install

CMD ["nodejs", "app.js"]
EXPOSE 3000