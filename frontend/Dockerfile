FROM node:20

WORKDIR /app

# Copy only package.json and package-lock.json first
COPY package*.json ./

# Clean install inside Docker
RUN rm -rf node_modules package-lock.json && npm install

# ✅ Force install rollup manually to bypass npm optional dependency bug
RUN npm install @rollup/rollup-linux-x64-gnu --save-dev

# Copy the rest of the app
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
