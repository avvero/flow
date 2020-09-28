Flow - follow logs over web
==============
Web log viewer for logback

### Demo
[Client-only demo](http://avvero.github.io/flow)

### Known issues
See issues

### Some params
```
-Dspring.profiles.active=production -Dspring.config.location=file:/application.yml
```
### build 
```bash
docker build -t flow .
docker run -d -p 8080:8080 -p 4561:4561 flow
```

### License: MIT
