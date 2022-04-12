---
layout: post
title: Service Objects
---

**Models** map our data from the db while **controllers** manage the flow of data between the model and the view.
When your app is a simple crud everything finds its home in your code base, but when your application is a bit more complex
and creating a record also means sending emails, creating activity, ... an issue occurs.

Some applications start to gain weight in their model department, typical rails saying I learned when starting was
*"fat models and thin controllers"*. Other applications prefer to put this logic in their controllers and prefer
*"thin models and fat controllers"* approach. And what I've usually experienced when joining an application is fat models and
fat controllers.

So where does this business logic belong, model or controller? Well the reason the discussion exists is because it doesn't belong
in either, so we might want to look into creating some of these small classes I rambled about in [here](). In this case we name these
small classes service objects, and we will let them handle our buseniss logic.

We start with creating an `ApplicationService` that all other services will inherit from. Why the prefix application? Because that is
the name rails uses, for example `ApplicationControlle` or `ApplicationRecord`. When not using rails I personally would use `BaseService`,
but lets keep it the rails way for now :).

```ruby
# app/services/application_controller.rb
class ApplicationService
  extend Executable
end
```

So let's say we have a model `Article` and when we want to make sure that after creating an article we send mails to all the
subscribed users and create an activity for the ...

Typical fat models approach would be:
```ruby
# app/models/article.rb
class Article < ApplicationRecord
  after_create :send_mails_to_subscribers
  after_create :create_activity

  private

  def send_mails_to_subscribers
    # mail logic
  end

  def create_activity
    # creating activity
  end
end
```

So let's move this logic into a service
```ruby
# app/services/article/create_service.rb
class Article::CreateService < ApplicationService
  def initialize(article = Article.new, params:)
    @article = article
    @params = params
  end

  def execute
    article.assign_attributes = params
    article.save
    send_mails_to_subscribers
    create_activity    
    article
  end

  private

  attr_reader :article, :params

  def send_mails_to_subscripers
  end

  def create_activity
  end
end
```
