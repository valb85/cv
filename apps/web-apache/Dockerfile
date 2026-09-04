ARG IMAGE_APACHE_BASE="httpd:2.4"

FROM $IMAGE_APACHE_BASE AS production

# The httpd image ships every module commented out. Enable only what the
# reverse proxy needs, then append our own config at the end of httpd.conf so
# it wins over anything the defaults set.
RUN sed -i \
    -e 's|^#\(LoadModule proxy_module\)|\1|' \
    -e 's|^#\(LoadModule proxy_http_module\)|\1|' \
    -e 's|^#\(LoadModule deflate_module\)|\1|' \
    -e 's|^#\(LoadModule headers_module\)|\1|' \
    -e 's|^#\(LoadModule rewrite_module\)|\1|' \
    /usr/local/apache2/conf/httpd.conf \
  && printf '%s\n' \
    'ServerName localhost' \
    'ServerTokens Prod' \
    'ServerSignature Off' \
    '' \
    'DocumentRoot /var/www' \
    '<Directory /var/www>' \
    '  Require all granted' \
    '  Options -Indexes' \
    '  AllowOverride None' \
    '</Directory>' \
    '' \
    '# Uploaded media is served straight off the shared volume, never proxied.' \
    'Alias /uploads /var/www/uploads' \
    '<Directory /var/www/uploads>' \
    '  Require all granted' \
    '  Options -Indexes -ExecCGI' \
    '  AllowOverride None' \
    '  SetHandler default-handler' \
    '</Directory>' \
    '' \
    'AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript' \
    'AddOutputFilterByType DEFLATE application/javascript application/json application/xml' \
    'AddOutputFilterByType DEFLATE image/svg+xml' \
    '' \
    'Header always set X-Content-Type-Options "nosniff"' \
    'Header always set X-Frame-Options "SAMEORIGIN"' \
    'Header always set Referrer-Policy "strict-origin-when-cross-origin"' \
    '' \
    'ProxyPreserveHost On' \
    'ProxyTimeout 600' \
    'ProxyErrorOverride On 502 503 504' \
    '' \
    '# Static paths handled here; everything else goes to the Next.js app.' \
    'ProxyPass /uploads !' \
    'ProxyPass /40x.html !' \
    'ProxyPass /50x.html !' \
    'ProxyPass / http://cv:3000/ retry=0' \
    'ProxyPassReverse / http://cv:3000/' \
    '' \
    'RequestHeader set X-Forwarded-Proto expr=%{REQUEST_SCHEME}' \
    '' \
    'ErrorDocument 502 /50x.html' \
    'ErrorDocument 503 /50x.html' \
    'ErrorDocument 504 /50x.html' \
    '' > /usr/local/apache2/conf/extra/cv.conf \
  && echo 'Include conf/extra/cv.conf' >> /usr/local/apache2/conf/httpd.conf \
  && mkdir -p /var/www/uploads

COPY webroot/ /var/www/
