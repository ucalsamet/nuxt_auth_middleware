export default function(context){
    if(!context.store.getters.isAuthenticeted){
        context.redirect("/auth")
    }
}