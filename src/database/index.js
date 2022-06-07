const mongoose = require("mongoose");

const connectToDatabase = async () => {
    await mongoose.connect(`mongodb+srv://Admin:Admin%40123@apinode.r5ibx.mongodb.net/ApiRestNode?retryWrites=true&w=majority`, (error) => {
        if(error) {
           return console.log("Ocorreu um erro ao se conectar ao banco de dados", error);
        }
        return console.log("conectado com sucesso");
    }
    );
};

module.exports = connectToDatabase;