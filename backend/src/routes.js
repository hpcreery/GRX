export default (app) => {

  // ############  OTHER  ############

  app.get('/', (req, res) => {
    res.send(
      'You have landed on the Full Stack applicaiton server-side instance. This can be opened for API usage. Documentation to come soon...'
    )
  })

  app.get('/test', (req, res) => {
    console.log(process.env)
    console.log(process.env.env)
    res.send({ env_variables: process.env, other_env: process.env.env })
  })

  app.get('/help', (req, res) => {
    res.sendFile(process.cwd() + '/README.md')
  })
}
