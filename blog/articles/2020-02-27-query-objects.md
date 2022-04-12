---
layout: post
title: Query Objects
date: 2020-02-27 17:25 +0100
---
## Use Case
Let's say we have an endpoint `/books` that can include many query params like `?name_matches=lord` that should return us all
the books matching the name `lord`.
- Lord of flies
- Lord of the Rings: The Fellowship of the Ring
- Lord of the Rings: The Two Towers
- Lord of the Rings: Return of the King

We also have a second endpoint `authors/:id/books` that returns us the books of a specific author. We also want to be able
to filter on this endpoint the same way but when we take the author 'J.R.R. Tolkien' our end result will be:
- Lord of the Rings: The Fellowship of the Ring
- Lord of the Rings: The Two Towers
- Lord of the Rings: Return of the King

The next step is to also add a range of dates to filter on the books publishing date.
I'm going to show you how I prefer to handle this by using the [Executable module]({% post_url 2020-01-12-executable-module %}) I already posted about.

## Create a Base Query object.
Just like you have an `ApplicationRecord` and `ApplicationController` we are going to add
an `ApplicationQuery`. If you are not using rails you could consider the name `BaseQuery`.
```ruby
# app/queries/application_query.rb
class ApplicationQuery
  extend Executable

  def initialize(base_relation, params)
    @base_relation = base_relation
    @params = params
  end

  private

  attr_reader :base_relation, :params
end
```

## Our first Query Object
Next we will create our query object.
```ruby
# app/queries/book/collection_query.rb
class Book::CollectionQuery < ApplicationQuery
  def execute
    base_relation.
      then(&method(:name_matches_clause)).
      then(&method(:published_at_clause))
  end

  private

  def name_matches_clause(relation)
    name_matches = params[:name_matches]
    return relation unless name_matches

    relation.where(table[:name].matches("%#{name_matches}%"))
  end

  def published_at_clause(relation)
    start_date = params[:published_at_from]&.to_time
    end_date = params[:published_at_until]&.to_time

    published_at = table[:published_at] 
    relation = relation.where(published_at.gteq(start_date) if start_date
    relation = relation.where(published_at.lteq(end_date) if end_date
    relation
  end

  def table
    Book.arel_table
  end
end
```

So now when we are in our `BooksController#index` we can do:
```ruby
def index
  books = Book::CollectionQuery.execute(Book.all, params)
  render json: books, status: :ok
end
```
while in our `Author::BooksController#index` we can do:
```ruby
def index
  author = Author.find(params[:author_id])
  books = Book::CollectionQuery.execute(author.books, params)
  render json: books, status: :ok
end
```

### what is then?
Ruby 2.5 introduced [yield_self](https://ruby-doc.org/core-2.7.0/Object.html#method-i-yield_self) and
Ruby 2.6 added a nice alias [then](https://github.com/AaronLasseigne/polyfill/pull/1) for it.
Combining this with the [&method](https://github.com/nvtin/sumary_knowledge/issues/5)
is a great way to visualise [piping](https://en.wikipedia.org/wiki/Pipeline_(software)) in ruby.

So this would be the same as doing:
```ruby
relation = base_relation
relation = name_matches_clause(relation)
relation = published_at_clause(relation)
relation
```

## Final note
Some guidelines:
- Nest under the model you return (`Book::` when you return books)
- Always return a collection so you don't break future queries. (Use [.none](https://api.rubyonrails.org/classes/ActiveRecord/QueryMethods.html#method-i-none))
- Do not add extra public methods besides `execute`.
- No your query is not special, you really do not need extra public methods 😜.

Mistakes I've made in the past:
- Adding pagination/sorting inside a CollectionQuery, this made it imposible to know how big the unpaginated collection was.
You could add extra public methods, but just extracting it will end up being cleaner more reusable fix.

## Sources
- Mainly [this](https://thoughtbot.com/blog/using-yieldself-for-composable-activerecord-relations) article from Thoughtbot.
- Working with a confusing mess of a filter(s) in the past + using this pattern in production with lovely results.
