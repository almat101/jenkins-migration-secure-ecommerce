// import axios from "axios";


// export const Interceptor = () => {
//     // Add a request interceptor
//     axios.interceptors.request.use(function (config) {
//         const token = localStorage.getItem('token');
//         // se ce  il token mettilo nell'header Authorization
//         if (token){
//             // console.log(token);
//             config.headers.Authorization = `Bearer ${token}`
//         }
//         return config;
//       }, function (error) {
//         return Promise.reject(error);
// });

// };


// // Add a response interceptor
// axios.interceptors.response.use(function onFulfilled(response) {
//     // Any status code that lie within the range of 2xx cause this function to trigger
//     // Do something with response data
//     return response;
//   }, function onRejected(error) {
//     // Any status codes that falls outside the range of 2xx cause this function to trigger
//     // Do something with response error
//     return Promise.reject(error);
//   });