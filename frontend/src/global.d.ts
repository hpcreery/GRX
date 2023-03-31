declare module '*.txt' {
  const content: string;
  export default content;
}
declare module '*.gbr' {
  const content: string;
  export default content;
}

declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}