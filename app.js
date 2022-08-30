const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connect with mongodb
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

// create schema that represents the structure of how data is being stored
const itemsSchema = {
  name: String
}

const listSchema = {
  name: String,
  items: [itemsSchema]
}

// create a model based on the schema created
// it will also create a collection with plural name `items` instead of `Item`
const Item = mongoose.model("Item", itemsSchema);
const ListItem = mongoose.model("ListItem", listSchema);

const item1 = new Item({
  name: "Welcome to my To-Do list web app!"
});

const item2 = new Item({
  name: "To add new item click on + symbol."
});

const item3 = new Item({
  name: "<== Check this box to remove the item."
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  const day = date.getDate();

  // getting data from DB
  Item.find({}, function(err, todoItems){
    // adding default items only once
    if (todoItems.length === 0){
      // adding items/data/documents into the collection
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Successfully installed defualt To-Do items.");
        }

        res.redirect("/");
      });
    } else {
      res.render("list", {listTitle: "Today: " + day, newListItems: todoItems});
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName.split(":")[0] === "Today"){
    item.save();
    res.redirect("/");
  } else {
    ListItem.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemID = req.body.itemCheckbox;
  const listName = req.body.listName;
  
  if (listName.split(":")[0] === "Today"){
    Item.findByIdAndRemove(checkedItemID, function(err){
      if (err){
        console.log("Something went wrong!!!");
      } else {
        res.redirect("/");
      }
    });
  } else {
    ListItem.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemID}}},
      function(err, results){
        if (!err){
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:listName", function(req, res){
  const listName = _.capitalize(req.params.listName);

  ListItem.findOne({name: listName}, function(err, foundList){
    if (!err){
      if (!foundList){
        const list = new ListItem({
          name: listName,
          items: defaultItems
        });
      
        list.save();

        res.redirect("/" + listName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
