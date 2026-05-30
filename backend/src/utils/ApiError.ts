export class ApiError extends Error {
  constructor(public statusCode:number,message:string,public isOperational=true){super(message);Error.captureStackTrace(this,this.constructor);}
  static badRequest(m:string){return new ApiError(400,m);}
  static unauthorized(m="Unauthorized"){return new ApiError(401,m);}
  static forbidden(m="Forbidden"){return new ApiError(403,m);}
  static notFound(m="Not found"){return new ApiError(404,m);}
  static tooMany(m="Too many"){return new ApiError(429,m);}
  static internal(m="Server error"){return new ApiError(500,m,false);}
}
