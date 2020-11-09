# GRX FrontEnd

## For Production

### Install dependencies

```
npm install
```

### Create production build

First edit .env for your environment.

```
REACT_APP_API=http://<address to backend>
REACT_APP_APIPORT=<ext to adress "/api" or ":8081">
```

Then, create optimized build that places static page in `/build`

```
npm run build
```

### Build into Docker Image for hosting the webpage [optional]

```
docker build -t <your-username>/grx-frontend .
```

### Then start the docker container

```
docker run -p 5000:5000 -d <your-username>/grx-frontend
```

or

### Create Electron App for multiplatform systems

```
npm run build_osx
npm run build_win
npm run build_linux
```

or

### Start with serve on port 5000

```
npm run start-serve
```

---

## For Development

### Start the App and develop with hot-reload

```
npm run start
```

---

Requirements

- Node v12 or greater

#### Acknowledgements

- [Node](https://nodejs.org/en/)
- [React](https://github.com/facebook/react)
- [Electron](https://github.com/electron/electron)
