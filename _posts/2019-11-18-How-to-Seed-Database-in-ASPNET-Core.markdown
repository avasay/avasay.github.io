---
layout: post
title:  "How to Seed Database in ASP.NET Core"
date:   2019-11-18 08:10:00 -0500
categories: dotnet core csharp
tags: rest api
comments: true
published: true
---

This is a quick guide on how to **seed** or **initialize** a **database** in ASP.NET Core 2.0. <!--more--> 

### Source Code
Download source code **[here][project-download]**. This project was created in Visual Studio Community 2019.

## Project Setup
I'm assuming you're working inside Visual Studio, and you have a **ASP.NET** project where you have at least **Controllers** and **Models** folders. Refer to my [previous post][web-api-post] for my *Employees Web API* as a a good example of an application that uses a database, but one that is not initialized on start up. In fact, this demo is building on top of that application.

### The Initializer class
Let's say we want to seed or initialize our *Employees* database. So, we need to create a class exclusively for this purpose. You can put this class in the same file as your EmployeeDBContext class, or in a separate file. I chose to do the latter. Inside the Models folder, we add a file called *EmployeeDBInitializer.cs*, and our *EmployeeDBInitializer* class looks something like this:
```
using Microsoft.EntityFrameworkCore;
:
:
public class EmployeeDBInitializer
{
    public static void Seed(EmployeeDBContext context)
    {
        
            if (context.Employees.Any())
            {
                return;
            }

            context.Employees.AddRange(
            new Employee
            {
                Id = 1,
                fName = "David",
                lName = "Bowie",
                age = 81,
                address = "123 Main St",
                city = "Hollywood",
                state = "CA",
                zipcode = "33019"
            },
            new Employee
            {
                Id = 2,
                fName = "Madonna",
                lName = "Ciccone",
                age = 61,
                address = "332 Market St",
                city = "Detroit",
                state = "MI",
                zipcode = "48201"
            },
            new Employee
            {
                Id = 3,
                fName = "Cyndi",
                lName = "Lauper",
                age = 67,
                address = "111 George St",
                city = "Brooklyn",
                state = "NY",
                zipcode = "11207"
            }

                );

            context.SaveChanges();
        
    }
}
```

As you can see, we added a method called **Seed()**, and we pass our DBContext to it. Use ```context.Employees.Add()``` to add a single Employee data, or ```context.Employess.AddRange()``` to add mulitple data.

### Using Dependency Injection to Get Database Context
In ASP.NET Core 2.0, it is recommended that seeding is called inside **Program.cs**. Our current Program class look like this:

```
public class Program
{
    public static void Main(string[] args)
    {
        CreateWebHostBuilder(args).Build().Run();
    }
    public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
        WebHost.CreateDefaultBuilder(args)
            .UseStartup<Startup>();
}
```

To call our database initializer, we need to change the Program class to this:

```
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
:
:
public class Program
{
    public static void Main(string[] args)
    {
        var host = CreateWebHostBuilder(args).Build();

        using (var scope = host.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
 
            var context = services.GetRequiredService<EmployeeDBContext>();

            EmployeeDBInitializer.Seed(context);
        }

        host.Run();
    }

    public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
        WebHost.CreateDefaultBuilder(args)
            .UseStartup<Startup>();
}
```

#### Brief Explanation

Notice that instead of
```
CreateWebHostBuilder(args).Build().Run();
```
I split it into two --- create **host** object in the beginning and execute **host.Run()** at the end.

Next, we do three things in this order:
1.  Get our service layer by calling 
    * ```host.Services.CreateScope().ServiceProvider```
2. Get a database context instance from the dependency injection container by calling
    * ```GetRequiredService<EmployeeDBContext>()```.
3. Call the Seed method by calling 
    * ```EmployeeDBInitializer.Seed()```

#### And that's it! 
That's all you have to do to seed your database in ASP.NET Core. 

___
### Alternatively...

I have also seen people do this, and it's perfectly fine --- in the Program class, you pass the ServiceProvider object to the initializer class, like this:

```
using (var scope = host.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    EmployeeDBInitializer.Seed(services);
}
```

And in your Initializer class, you, then, change the Seed method to this,
```
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
:
:
public class EmployeeDBInitializer
{

    public static void Seed(IServiceProvider serviceProvider)
    {
        using (var context = new EmployeeContext(serviceProvider.GetRequiredService<DbContextOptions<EmployeeContext>>()))
        {
            if (context.Employees.Any())
            {
                return;
            }
            :
            :
            :
        }
    }
}

```
So that dependency injection happens in your initializer class instead of your Program class.

I really don't see anything significantly different in passing the ServiceProvider object, as opposed to passing the DBContext object. For some reason, I find the first one --- passing DBContext a lot more intuitive and cleaner. Maybe you have a different opinion of it? Let me know!

### And That's it Folks!
In my next post I will talk about using Repository pattern in our service layer so that there is a separation of business and data logic in our controllers.



[project-download]: https://github.com/avasay/WebAPIDepInjectIRepository

[web-api-post]: /dotnet/core/csharp/2019/11/16/dotNETCore-REST-API-InMemoryDB.html

