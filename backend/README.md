# GRX BackEnd

Gerver database viewer with 3D showcase

## For Production

### Install dependencies

```
npm install
```

### Edit Env Variables

```
ARTWORKDB=</absolute/path/to/db>

```
**Make sure path exists in container or server**

### Start with pm2

```
npm run start-prod
```

Then you can monitor with `pm2 monit`

or

### Build Docker Image

```
docker build -t <your-username>/grx-backend.
```

### Run Docker Container

```
docker run -p 8081:8081 -d hpcreery/grx-backend
```

### Requirements

- Node v12 or greater

#### Acknowledgements

- [Node](https://nodejs.org/en/)
- [Express](https://expressjs.com/)
- [Gerber Modules](https://github.com/tracespace/tracespace)
