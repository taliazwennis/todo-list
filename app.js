//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const port = process.env.PORT || 3001;


const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let day = "";
mongoose.connect(
  "mongodb+srv://taliazwennis:Test123@cluster0.tflix2w.mongodb.net/todolistDB"
);

const itemsSchema = { name: String };

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to do list",
});
const item2 = new Item({
  name: "Hit the + button to add a new line",
});
const item3 = new Item({
  name: "<--- Hit this to delete an item",
});

const listScheme = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listScheme);

app.get("/", async function (req, res) {
  day = date.getDate();
  const foundItems = await Item.find({}).exec();
  if (foundItems.length === 0) {
    Item.insertMany([item1, item2, item3])
      .then(function () {
        console.log("Successfully saved defult items to DB");
      })
      .catch(function (err) {
        console.log(err);
      });
  }
  res.render("list", { listTitle: day, newListItems: foundItems });

  res.redirect("/");
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({ name: itemName });
  if (listName === day) {
    item.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName }).exec();
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === day) {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        console.log("Successfully deleted checked item");
      })
      .catch(function (err) {
        console.log(err);
      });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(function () {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  const foundList = await List.findOne({ name: customListName }).exec();
  if (foundList == null) {
    const list = new List({
      name: customListName,
      items: [item1, item2, item3],
    });
    list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", {
      listTitle: customListName,
      newListItems: foundList.items,
    });
  }
});

app.listen(port, function () {
  console.log("Server started on port 3001");
});
