# GRX FrontEnd

ODB++ database viewer with 3D showcase

## For Starters

Install dependencies

```
npm install
```

Create production build

```
npm run build
```

Build into Docker Image for hosting the webpage [optional]

```
docker build -t <your-username>/grx-frontend .
```

Then start the docker container

```
docker run -p 5000:5000 -d hpcreery/grx-frontend
```

or

Create Electron App for multiplatform systems

```
npm run build_osx
npm run build_win
npm run build_linux
```

or

Start the App and develop with hot-reload

```
npm run start
```


Acknowledgements

- [React](https://github.com/facebook/react)
- [Electron](https://github.com/electron/electron)
