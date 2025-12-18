FROM mcr.microsoft.com/dotnet/sdk:8.0

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs openjdk-17-jre

RUN dotnet tool install -g dotnet-stryker \
    && dotnet tool install -g coverlet.console

ENV PATH="$PATH:/root/.dotnet/tools"

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 3000
CMD ["npm", "start"]
