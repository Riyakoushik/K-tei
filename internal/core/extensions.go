package core

import (
	"seanime/internal/extension"
	"seanime/internal/extension_repo"


	"github.com/rs/zerolog"
)

func LoadCustomSourceExtensions(extensionRepository *extension_repo.Repository) {
	extensionRepository.LoadOnlyWrapper([]extension.Type{extension.TypeCustomSource}, func() {
		extensionRepository.ReloadExternalExtensions()
	})
}

func LoadExtensions(extensionRepository *extension_repo.Repository, logger *zerolog.Logger, config *Config) {
	// Load built-in extensions

	// Load external extensions
	//extensionRepository.ReloadExternalExtensions()
	extensionRepository.LoadOnlyWrapper([]extension.Type{extension.TypeOnlinestreamProvider, extension.TypeAnimeTorrentProvider, extension.TypePlugin}, func() {
		extensionRepository.ReloadExternalExtensions()
	})
}
