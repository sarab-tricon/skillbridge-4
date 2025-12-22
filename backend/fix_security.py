import re

# Read the file
with open(r'c:\skillbridge_final\skillbridge-4\backend\src\main\java\com\skillbridge\config\SecurityConfig.java', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix first broken chain
content = re.sub(
    r'\.requestMatchers\(HttpMethod\.GET, "/assignments/pending"\)\s+\.hasAnyAuthority',
    '.requestMatchers(HttpMethod.GET, "/assignments/pending").hasAnyAuthority',
    content
)

# Fix second broken chain
content = re.sub(
    r'\.requestMatchers\(HttpMethod\.PUT, "/assignments/\*/approve", "/assignments/\*/reject",\s+"/assignments/\*/end"\)\s+\.hasAnyAuthority',
    '.requestMatchers(HttpMethod.PUT, "/assignments/*/approve", "/assignments/*/reject", "/assignments/*/end").hasAnyAuthority',
    content
)

# Write back
with open(r'c:\skillbridge_final\skillbridge-4\backend\src\main\java\com\skillbridge\config\SecurityConfig.java', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed SecurityConfig.java")
