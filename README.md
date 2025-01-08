# HTML to PDF/JPG

Uses [Puppeteer](https://pptr.dev/) and ChromeForTesting to produce PDFs or Images from any website.

## Create image on MacOS

```shell 
softwareupdate --install-rosetta
colima start --profile rosetta --cpu 2 --memory 4 --disk 40 --arch aarch64 --vm-type=vz --vz-rosetta --mount-type virtiofs
docker build
```

## Execute on docker

```shell
docker run -i --init --cap-add=SYS_ADMIN --rm puppeteer
```

## Execute on local

```shell
npm install
npm start
```

Sample request:

```shell
curl -X POST \
  'http://localhost:3100/convert?url=https://www.yahoo.com/&output=pdf' \
  -H 'Content-Type: application/json' \
  -d '{"options": {"format": "A4", "printBackground": true}}' \
  --output example.pdf
```