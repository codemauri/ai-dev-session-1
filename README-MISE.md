# Using mise with Recipe Manager

This project uses [mise](https://mise.jdx.dev/) for managing runtime versions (Node.js and Python).

## Quick Start

```bash
# 1. Install mise (if not already installed)
curl https://mise.run | sh

# 2. Install project dependencies (Node 24 and Python 3.13)
mise install

# 3. Verify versions
mise current

# 4. Proceed with project setup
make setup
make install
make dev
```

## What is mise?

mise is a modern runtime manager that:
- Automatically switches to the correct Node.js and Python versions
- Works with `.mise.toml` configuration files
- Replaces tools like nvm, pyenv, rbenv, etc.
- Supports many languages and tools in one tool

## Configuration

This project includes a `.mise.toml` file that specifies:
```toml
[tools]
node = "24"
python = "3.13"
```

When you're in the project directory, mise will automatically use these versions.

## Common Commands

```bash
# Install all tools specified in .mise.toml
mise install

# Show current active versions
mise current

# List installed versions
mise list

# Upgrade mise itself
mise self-update
```

## Troubleshooting

### mise not activating automatically

Make sure mise is properly initialized in your shell:

```bash
# For bash
echo 'eval "$(mise activate bash)"' >> ~/.bashrc

# For zsh
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc

# For fish
echo 'mise activate fish | source' >> ~/.config/fish/config.fish

# Then restart your shell or run:
source ~/.bashrc  # or ~/.zshrc
```

### Versions not matching

If `make check-versions` shows wrong versions:

```bash
# Ensure mise is activated in current shell
eval "$(mise activate bash)"  # or zsh

# Check what mise is using
mise current

# If needed, reinstall
mise install --force
```

## Without mise

If you prefer not to use mise, you can install Node 24 and Python 3.13 manually:

- **Node.js 24**: https://nodejs.org/ or via Homebrew/winget
- **Python 3.13**: https://python.org/ or via Homebrew/winget

See the main [README.md](README.md#installing-prerequisites) for detailed manual installation instructions.
