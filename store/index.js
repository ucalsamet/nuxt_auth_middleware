import Vuex from "vuex";
import Cookie from "js-cookie";
import axios from "axios";

const createStore = () => {
  return new Vuex.Store({
    state: {
      authKey: null
    },
    mutations: {
      setAuthKey(state, payload) {
        state.authKey = payload;
      },
      clearAuthKey(state) {
        Cookie.remove("authKey");
        Cookie.remove("expiresIn");
        if(process.client){
          localStorage.removeItem("authKey");
          localStorage.removeItem("expiresIn");
        }
        state.authKey = null;
      }
    },
    actions: {
      nuxtServerInit(vuexContext, context) {},
      initAuth(vuexContext, payload) {
        let token;
        let expiresIn;
        if (payload) {
          //Server üzerinde çalışıyoruz...
          if (!payload.headers.cookie) {
            return;
          }
          //Cookie üzerinden Token elde etmek...
          token = payload.headers.cookie
            .split(";")
            .find(c => c.trim().startsWith("authKey="));
          if (token) {
            token = token.split("=")[1];
          }

          expiresIn = payload.headers.cookie
            .split(";")
            .find(e => e.trim().startsWith("expiresIn="));
          if (expiresIn) {
            expiresIn = expiresIn.split("=")[1];
          }
        } else {
          //Client üzerinde çalışıyoruz...
          token = localStorage.getItem("authKey");
          expiresIn = localStorage.getItem("expiresIn");
        }
        if (new Date().getTime() >  parseInt(expiresIn) || !token) {
          vuexContext.commit("clearAuthKey")
        }
        vuexContext.commit("setAuthKey", token);
      },
      authUser(vuexContext, payload) {
        let authLink =
          "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=";
        if (payload.isUser) {
          authLink =
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";
        }
        return axios
          .post(authLink + process.env.firebaseAPIKEY, {
            email: payload.email,
            password: payload.password,
            returnSecureToken: true
          })
          .then(response => {
            console.log(response);

            let expiresIn =new Date().getTime() + 10000;
              // new Date().getTime() + +response.data.expiresIn * 1000;
              

            Cookie.set("authKey", response.data.idToken);
            Cookie.set("expiresIn", expiresIn);
            localStorage.setItem("authKey", response.data.idToken);
            localStorage.setItem("expiresIn", expiresIn);
            vuexContext.commit("setAuthKey", response.data.idToken);
          });

        //payload.$store.dispatch("login", response.data.idToken);
      },
      logout(vuexContext) {
        vuexContext.commit("clearAuthKey");
      }
    },
    getters: {
      isAuthenticeted(state) {
        return state.authKey != null;
      },
      getAuthKey(state) {
        return state.authKey;
      }
    }
  });
};

export default createStore;
